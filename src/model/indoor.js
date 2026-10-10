// PATH: src/model/indoor.js
// Single-zone indoor PM2.5 mass-balance model (ADR-002, corrected).
// Pure module: no I/O, no dependencies, never mutates its inputs.

const Q_MIN = 0;
const Q_MAX = 3;
const DT_HOURS = 1;

/**
 * Default model parameters.
 * - P: penetration factor (dimensionless, 0..1)
 * - a: air exchange rate (1/hr)
 * - k: indoor deposition rate (1/hr)
 * - Q: filtration removal rate from the HEPA slider (1/hr, clamped to 0..3)
 */
export const INDOOR_DEFAULTS = Object.freeze({ P: 0.8, a: 1.0, k: 0.2, Q: 0 });

// Finite, non-negative number or null. Accepts numeric strings.
function toValid(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

// Merge user params over defaults. Invalid fields fall back silently.
function resolveParams(params) {
  const p = params && typeof params === 'object' ? params : {};
  const pick = (key) => toValid(p[key]) ?? INDOOR_DEFAULTS[key];
  const Q = Math.min(Q_MAX, Math.max(Q_MIN, pick('Q')));
  return { P: pick('P'), a: pick('a'), k: pick('k'), Q, initial: toValid(p.initial) };
}

/**
 * Steady-state indoor PM2.5 for a constant outdoor concentration.
 *
 *   Cin_ss = P·a·Cout / (a + k + Q)
 *
 * Defaults: P=0.8, a=1.0/hr, k=0.2/hr, Q=0/hr (Q clamped to 0..3).
 * At defaults this is ≈0.67× outdoor; at Q=3 it is ≈0.19× outdoor.
 *
 * @param {number} cout Outdoor PM2.5 (µg/m³).
 * @param {{P?: number, a?: number, k?: number, Q?: number|string}} [params]
 * @returns {number|null} null if cout is invalid or total loss rate is 0.
 */
export function steadyStateIndoor(cout, params = {}) {
  const c = toValid(cout);
  if (c === null) return null;
  const { P, a, k, Q } = resolveParams(params);
  const loss = a + k + Q;
  if (loss <= 0) return null;
  return (P * a * c) / loss;
}

/**
 * Simulate hourly indoor PM2.5 from an outdoor PM2.5 series.
 *
 *   dCin/dt = P·a·Cout − (a + k + Q)·Cin
 *
 * Solved exactly over each 1-hour step, holding Cout constant for the hour
 * (Euler is unstable at Q=3, where the loss rate is 4.2/hr):
 *
 *   L      = a + k + Q
 *   Css    = P·a·Cout / L
 *   Cin[i] = Css + (Cin[i-1] − Css)·e^(−L·Δt),  Δt = 1 hr
 *
 * Step i uses Cout[i] (the outdoor value for the hour ending at time[i]).
 *
 * Defaults: P=0.8, a=1.0/hr, k=0.2/hr, Q=0/hr. Q is clamped to 0..3 and may
 * be a numeric string (slider value). Invalid params fall back to defaults.
 * `initial` sets Cin at the first valid hour; otherwise Cin starts at the
 * steady state for the first valid outdoor value.
 *
 * Missing input (null, undefined, NaN, ±Infinity, negative):
 * - before the first valid value → output null
 * - after it → the last valid Cout is carried forward and the model keeps
 *   evolving, so output is a number
 *
 * @param {Array<number|null|undefined>} outdoorPm25 Hourly outdoor PM2.5.
 * @param {{P?: number, a?: number, k?: number, Q?: number|string, initial?: number}} [params]
 * @returns {(number|null)[]} Same length as input ([] for non-array input).
 *   Never contains NaN. The input array is not mutated.
 */
export function simulateIndoor(outdoorPm25, params = {}) {
  if (!Array.isArray(outdoorPm25)) return [];

  const { P, a, k, Q, initial } = resolveParams(params);
  const loss = a + k + Q;
  const decay = Math.exp(-loss * DT_HOURS);
  const out = new Array(outdoorPm25.length).fill(null);

  let cin = null;
  let lastCout = null;

  for (let i = 0; i < outdoorPm25.length; i += 1) {
    const c = toValid(outdoorPm25[i]);
    if (c !== null) lastCout = c;
    if (lastCout === null) continue; // leading gap

    if (cin === null) {
      // First valid hour: start from `initial` or steady state.
      cin = initial ?? (loss > 0 ? (P * a * lastCout) / loss : 0);
    } else if (loss > 0) {
      const css = (P * a * lastCout) / loss;
      cin = css + (cin - css) * decay;
    }
    // loss === 0 implies a === 0, so no source and no sink: cin holds.

    out[i] = Number.isFinite(cin) && cin > 0 ? cin : 0;
  }

  return out;
}
