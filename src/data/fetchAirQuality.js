// PATH: src/data/fetchAirQuality.js
const AQ_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality';

export async function fetchAirQuality(lat, lon) {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    hourly: 'pm10,pm2_5,nitrogen_dioxide,ozone,carbon_monoxide',
    past_days: '7',
    forecast_days: '2',
    timezone: 'auto',
  });

  const res = await fetch(`${AQ_URL}?${params}`);
  if (!res.ok) {
    throw new Error(`Air quality fetch failed: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  const h = json.hourly ?? {};

  return {
    time: h.time ?? [],
    pm25: h.pm2_5 ?? [],
    pm10: h.pm10 ?? [],
    no2: h.nitrogen_dioxide ?? [],
    o3: h.ozone ?? [],
    co: h.carbon_monoxide ?? [],
  };
}
