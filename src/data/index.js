// PATH: src/data/index.js
import { fetchAirQuality } from './fetchAirQuality.js';
import { fetchWeather } from './fetchWeather.js';
import { fetchFires } from './fetchFires.js';
import { attachFires } from './normalize.js';

// Re-index a weather series onto the AQ timeline by timestamp.
function alignTo(time, srcTime, series) {
  const idx = new Map(srcTime.map((t, i) => [t, i]));
  return time.map((t) => {
    const i = idx.get(t);
    return i === undefined ? null : series[i] ?? null;
  });
}

export async function fetchSchoolData(school) {
  const [aq, wx, fires] = await Promise.all([
    fetchAirQuality(school.lat, school.lon),
    fetchWeather(school.lat, school.lon),
    fetchFires().catch(() => []),
  ]);

  const time = aq.time;
  const align = (series) => alignTo(time, wx.time, series);

  const windDir = align(wx.windDir);
  const lastWind = windDir[windDir.length - 1] ?? 0;
  const fireEvents = attachFires(school, fires, lastWind);

  return {
    schoolId: school.id,
    school,
    time,
    pm25: aq.pm25,
    pm10: aq.pm10,
    no2: aq.no2,
    o3: aq.o3,
    co: aq.co,
    temp: align(wx.temp),
    humidity: align(wx.humidity),
    windSpeed: align(wx.windSpeed),
    windDir,
    apparentTemp: align(wx.apparentTemp),
    fireEvents,
  };
}
