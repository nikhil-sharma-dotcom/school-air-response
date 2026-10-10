// PATH: src/rules/engine.js
// Explainable rule engine (ADR-001, ADR-005).
// Pure module: no I/O, no dependencies, never mutates inputs, never throws.

const SEVERITY_RANK = Object.freeze({ green: 0, yellow: 1, orange: 2, red: 3 });

const TIMELINE_KEYS = Object.freeze([
  'pm25', 'pm10', 'no2', 'o3', 'co',
  'temp', 'humidity', 'windSpeed', 'windDir', 'apparentTemp',
]);

// True only for real, finite numbers. Guards against `null > -1 === true`.
const num = (v) => typeof v === 'number' && Number.isFinite(v);
const numOrNull = (v) => (num(v) ? v : null);

// Smallest absolute difference between two headings, in [0, 180].
function angularDiff(a, b) {
  const d = (((a - b) % 360) + 360) % 360;
  return d > 180 ? 360 - d : d;
}

/**
 * Rules: { id, severity, test(d), why(d), action }.
 * Every test() requires each value its why() interpolates to be finite.
 */
const RULES = Object.freeze([
  Object.freeze({
    id: 'compound_smoke_heat',
    severity: 'red',
    test: (d) => num(d.pm25) && num(d.apparentTemp) && d.pm25 > 60 && d.apparentTemp > 40,
    why: (d) =>
      `PM2.5 is ${d.pm25.toFixed(0)} µg/m³ (limit 60) and it feels like ` +
      `${d.apparentTemp.toFixed(0)}°C (limit 40). Smoke and heat together: ` +
      'closing windows keeps smoke out but traps heat.',
    action:
      'Move all students into air-conditioned, filtered rooms. Cancel outdoor ' +
      'activity and PE. Keep windows and doors closed and run AC and HEPA. ' +
      'Put the nurse on standby for heat and breathing symptoms.',
  }),
  Object.freeze({
    id: 'smoke_respiratory',
    severity: 'orange',
    test: (d) => num(d.pm25) && d.pm25 > 60,
    why: (d) =>
      `PM2.5 is ${d.pm25.toFixed(0)} µg/m³, ${(d.pm25 / 60).toFixed(1)}× the ` +
      '60 µg/m³ threshold.',
    action:
      'Cancel outdoor recess and PE. Keep students with asthma indoors and ' +
      'alert the nurse. Close windows and doors.',
  }),
  Object.freeze({
    id: 'smoke_upwind',
    severity: 'orange',
    test: (d) =>
      num(d.nearestFireKm) && num(d.pm25) &&
      d.nearestFireKm < 100 && d.fireIsUpwind === true && d.pm25 > 40,
    why: (d) => {
      const wind =
        num(d.windDir) && num(d.windSpeed)
          ? ` (wind from ${d.windDir.toFixed(0)}° at ${d.windSpeed.toFixed(0)} km/h)`
          : '';
      return (
        `Nearest active fire is ${d.nearestFireKm.toFixed(0)} km away and ` +
        `upwind${wind}. PM2.5 is ${d.pm25.toFixed(0)} µg/m³, which points to ` +
        'smoke, not traffic or dust.'
      );
    },
    action:
      'Treat this as smoke and expect PM2.5 to rise. Set HVAC to recirculate, ' +
      'put HEPA units in place, and get the indoor-recess plan ready.',
  }),
  Object.freeze({
    id: 'infiltration_failure',
    severity: 'orange',
    test: (d) =>
      num(d.ioRatio) && num(d.pm25) && num(d.indoorPm25) &&
      d.ioRatio > 0.6 && d.pm25 > 50,
    why: (d) =>
      `Indoor PM2.5 is modeled at ${d.indoorPm25.toFixed(0)} µg/m³ — ` +
      `${(d.ioRatio * 100).toFixed(0)}% of outdoor. Above 60%, filtration is ` +
      "not keeping up with what's coming in.",
    action:
      'Turn on portable HEPA purifiers in occupied rooms. Set HVAC to ' +
      'recirculate with the best filter available (MERV 13 or higher). ' +
      'Close open windows and doors.',
  }),
  Object.freeze({
    id: 'dust_resuspension',
    severity: 'yellow',
    test: (d) =>
      num(d.pm10) && num(d.pm25) && num(d.windSpeed) &&
      d.pm25 > 0 && d.pm10 / d.pm25 > 3 && d.windSpeed > 25,
    why: (d) =>
      `PM10 is ${(d.pm10 / d.pm25).toFixed(1)}× PM2.5 (${d.pm10.toFixed(0)} vs ` +
      `${d.pm25.toFixed(0)} µg/m³) with wind at ${d.windSpeed.toFixed(0)} km/h. ` +
      'Coarse particles plus wind means blowing dust, not smoke.',
    action:
      'Move outdoor activity off dirt fields and close windows on the ' +
      'windward side. Dust settles when the wind drops.',
  }),
]);

/**
 * Evaluate all rules against one flat data point (see buildDataPoint).
 * Severity order: green < yellow < orange < red. Tier is 'green' when
 * nothing fires. A rule whose test() or why() throws is skipped.
 *
 * @param {object} data Flat data point.
 * @returns {{tier: 'green'|'yellow'|'orange'|'red',
 *            fired: Array<{id: string, severity: string, why: string, action: string}>}}
 */
export function evaluate(data) {
  if (!data || typeof data !== 'object') return { tier: 'green', fired: [] };

  const fired = [];
  for (const rule of RULES) {
    let hit;
    try {
      hit = rule.test(data) === true;
    } catch {
      hit = false;
    }
    if (!hit) continue;

    let why;
    try {
      why = rule.why(data);
    } catch {
      continue; // never emit a rule without a numeric explanation
    }
    if (typeof why !== 'string' || why.includes('NaN')) continue;

    fired.push({ id: rule.id, severity: rule.severity, why, action: rule.action });
  }

  // Highest severity first; stable sort keeps rule order within a tier.
  fired.sort((x, y) => SEVERITY_RANK[y.severity] - SEVERITY_RANK[x.severity]);

  const tier = fired.length > 0 ? fired[0].severity : 'green';
  return { tier, fired };
}

/**
 * Adapter from timeline arrays to the rule engine's flat input.
 *
 * - Timeline fields: finite value at `index`, else null.
 * - indoorPm25: finite indoorArray[index], else null.
 * - ioRatio: indoorPm25 / pm25 when both finite and pm25 > 0, else null.
 * - nearestFireKm: fireEvents[0].distanceKm (list is pre-sorted), else null.
 * - fireIsUpwind: recomputed from fireEvents[0].bearing vs windDir[index]
 *   (angular diff < 90°, wrap-around); falls back to the stored `upwind`
 *   when windDir is missing; null when there are no fires.
 * Invalid timeline or out-of-range index → every key null. Never throws.
 *
 * @param {object} timeline Output of fetchSchoolData.
 * @param {number} index Hour index into the timeline arrays.
 * @param {(number|null)[]} indoorArray Output of simulateIndoor.
 * @returns {object} Flat data point for evaluate().
 */
export function buildDataPoint(timeline, index, indoorArray) {
  const point = {
    pm25: null, pm10: null, no2: null, o3: null, co: null,
    temp: null, humidity: null, windSpeed: null, windDir: null, apparentTemp: null,
    indoorPm25: null, ioRatio: null, nearestFireKm: null, fireIsUpwind: null,
  };

  try {
    if (!timeline || typeof timeline !== 'object') return point;
    const len = Array.isArray(timeline.time) ? timeline.time.length : 0;
    if (!Number.isInteger(index) || index < 0 || index >= len) return point;

    for (const key of TIMELINE_KEYS) {
      const series = timeline[key];
      point[key] = Array.isArray(series) ? numOrNull(series[index]) : null;
    }

    point.indoorPm25 = Array.isArray(indoorArray) ? numOrNull(indoorArray[index]) : null;

    if (num(point.indoorPm25) && num(point.pm25) && point.pm25 > 0) {
      point.ioRatio = point.indoorPm25 / point.pm25;
    }

    const fires = Array.isArray(timeline.fireEvents) ? timeline.fireEvents : [];
    const nearest = fires[0];
    if (nearest && typeof nearest === 'object') {
      point.nearestFireKm = numOrNull(nearest.distanceKm);
      if (num(point.windDir) && num(nearest.bearing)) {
        point.fireIsUpwind = angularDiff(nearest.bearing, point.windDir) < 90;
      } else {
        point.fireIsUpwind = typeof nearest.upwind === 'boolean' ? nearest.upwind : null;
      }
    }
  } catch {
    // Fall through with whatever was filled; never throw.
  }

  return point;
}
