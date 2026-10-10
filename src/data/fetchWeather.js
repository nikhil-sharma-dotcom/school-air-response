// PATH: src/data/fetchWeather.js
const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast';

export async function fetchWeather(lat, lon) {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    hourly:
      'temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,apparent_temperature',
    past_days: '7',
    forecast_days: '2',
    timezone: 'auto',
  });

  const res = await fetch(`${WEATHER_URL}?${params}`);
  if (!res.ok) {
    throw new Error(`Weather fetch failed: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  const h = json.hourly ?? {};

  return {
    time: h.time ?? [],
    temp: h.temperature_2m ?? [],
    humidity: h.relative_humidity_2m ?? [],
    windSpeed: h.wind_speed_10m ?? [],
    windDir: h.wind_direction_10m ?? [],
    apparentTemp: h.apparent_temperature ?? [],
  };
}
