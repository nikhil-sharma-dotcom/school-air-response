// PATH: src/components/constants.js
// Shared UI constants and pure formatters. No components here
// (keeps react-refresh/only-export-components happy).

export const TIER_COLORS = Object.freeze({
  green: '#22c55e',
  yellow: '#eab308',
  orange: '#f97316',
  red: '#ef4444',
});

export const TIER_LABELS = Object.freeze({
  green: 'GREEN',
  yellow: 'YELLOW',
  orange: 'ORANGE',
  red: 'RED',
});

export const TIER_MEANING = Object.freeze({
  green: 'No action needed',
  yellow: 'Use caution',
  orange: 'Act now',
  red: 'Severe — act immediately',
});

export const LINE_COLORS = Object.freeze({
  outdoor: '#60a5fa',
  indoor: '#a78bfa',
});

// CPCB PM2.5 categories (µg/m³). `to: Infinity` is clamped to the chart max.
export const BANDS = Object.freeze([
  Object.freeze({ from: 0, to: 30, color: '#22c55e', label: 'Good' }),
  Object.freeze({ from: 30, to: 60, color: '#eab308', label: 'Satisfactory' }),
  Object.freeze({ from: 60, to: 90, color: '#f97316', label: 'Moderate' }),
  Object.freeze({ from: 90, to: 120, color: '#ef4444', label: 'Poor' }),
  Object.freeze({ from: 120, to: 250, color: '#b91c1c', label: 'Very poor' }),
  Object.freeze({ from: 250, to: Infinity, color: '#7f1d1d', label: 'Severe' }),
]);

export const CITY_BY_ID = Object.freeze({
  s1: 'Delhi',
  s2: 'Mumbai',
  s3: 'Bengaluru',
});

export const HERO_ID = 's1';
export const PLAY_INTERVAL_MS = 120;

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

/** CPCB band for a PM2.5 value, or null. */
export function bandFor(v) {
  if (!isNum(v)) return null;
  return BANDS.find((b) => v >= b.from && v < b.to) ?? BANDS[BANDS.length - 1];
}

/** Number → fixed string, or an em dash when missing. */
export function fmt(v, digits = 0) {
  return isNum(v) ? v.toFixed(digits) : '—';
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Parse "YYYY-MM-DDTHH:mm" (school-local) without letting the browser
// shift it into the viewer's timezone.
function parts(iso) {
  const m = typeof iso === 'string' && iso.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return null;
  const [, y, mo, d, h, mi] = m;
  const dow = new Date(Date.UTC(+y, +mo - 1, +d)).getUTCDay();
  return { dow: DAYS[dow], day: +d, mon: MONTHS[+mo - 1], hh: h, mm: mi };
}

/** "Sat 10 Oct, 14:00" */
export function formatTime(iso) {
  const p = parts(iso);
  return p ? `${p.dow} ${p.day} ${p.mon}, ${p.hh}:${p.mm}` : '—';
}

/** "Sat 10" — for chart day ticks. */
export function formatDay(iso) {
  const p = parts(iso);
  return p ? `${p.dow} ${p.day}` : '';
}

/** True when the timestamp is local midnight. */
export function isMidnight(iso) {
  return typeof iso === 'string' && iso.slice(11, 16) === '00:00';
}

const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

/** Degrees → 8-point compass, or ''. */
export function compass(deg) {
  if (!isNum(deg)) return '';
  return COMPASS[Math.round((((deg % 360) + 360) % 360) / 45) % 8];
}
