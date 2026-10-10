// PATH: src/data/normalize.js
const EARTH_RADIUS_KM = 6371;
const toRad = (deg) => (deg * Math.PI) / 180;
const toDeg = (rad) => (rad * 180) / Math.PI;

export function haversine(lat1, lon1, lat2, lon2) {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

// Initial great-circle bearing from point 1 to point 2, degrees in [0, 360).
export function bearing(lat1, lon1, lat2, lon2) {
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const dLon = toRad(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLon);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

// Smallest absolute difference between two headings, in [0, 180].
function angularDiff(a, b) {
  const d = Math.abs((((a - b) % 360) + 360) % 360);
  return d > 180 ? 360 - d : d;
}

// windDir is meteorological: the direction the wind blows FROM.
// A fire is upwind when the bearing school -> fire is within 90° of windDir.
export function attachFires(school, fires, windDir) {
  return (fires ?? [])
    .map((fire) => {
      const distanceKm = haversine(school.lat, school.lon, fire.lat, fire.lon);
      const brg = bearing(school.lat, school.lon, fire.lat, fire.lon);
      return {
        ...fire,
        distanceKm,
        bearing: brg,
        upwind: angularDiff(brg, windDir) < 90,
      };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);
}
